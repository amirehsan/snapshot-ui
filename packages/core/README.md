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

- [App shell](https://snapshotui.com/docs/components/app-shell)
- [Avatar](https://snapshotui.com/docs/components/avatar)
- [Badge](https://snapshotui.com/docs/components/badge)
- [Bottom tab bar](https://snapshotui.com/docs/components/bottom-tab-bar)
- [Breadcrumbs](https://snapshotui.com/docs/components/breadcrumbs)
- [Button](https://snapshotui.com/docs/components/button)
- [Calendar](https://snapshotui.com/docs/components/calendar)
- [Card](https://snapshotui.com/docs/components/card)
- [Checkbox](https://snapshotui.com/docs/components/checkbox)
- [Collapsible card](https://snapshotui.com/docs/components/collapsible-card)
- [Combo box](https://snapshotui.com/docs/components/combo-box)
- [Command palette](https://snapshotui.com/docs/components/command-palette)
- [Confirm dialog](https://snapshotui.com/docs/components/confirm-dialog)
- [Data table](https://snapshotui.com/docs/components/data-table)
- [Date picker](https://snapshotui.com/docs/components/date-picker)
- [Date range picker](https://snapshotui.com/docs/components/date-range-picker)
- [Description list](https://snapshotui.com/docs/components/description-list)
- [Dialog](https://snapshotui.com/docs/components/dialog)
- [Drawer](https://snapshotui.com/docs/components/drawer)
- [Empty state](https://snapshotui.com/docs/components/empty-state)
- [Field parts](https://snapshotui.com/docs/components/field)
- [File drop zone](https://snapshotui.com/docs/components/file-drop-zone)
- [Filter bar](https://snapshotui.com/docs/components/filter-bar)
- [Filter chip](https://snapshotui.com/docs/components/filter-chip)
- [Icon button](https://snapshotui.com/docs/components/icon-button)
- [Kbd](https://snapshotui.com/docs/components/kbd)
- [Link](https://snapshotui.com/docs/components/link)
- [Menu](https://snapshotui.com/docs/components/menu)
- [Meter](https://snapshotui.com/docs/components/meter)
- [Multi-select](https://snapshotui.com/docs/components/multi-select)
- [Number field](https://snapshotui.com/docs/components/number-field)
- [Page header](https://snapshotui.com/docs/components/page-header)
- [Pagination](https://snapshotui.com/docs/components/pagination)
- [Popover](https://snapshotui.com/docs/components/popover)
- [Progress bar](https://snapshotui.com/docs/components/progress-bar)
- [Radio group](https://snapshotui.com/docs/components/radio-group)
- [Save bar](https://snapshotui.com/docs/components/save-bar)
- [Search field](https://snapshotui.com/docs/components/search-field)
- [Segmented control](https://snapshotui.com/docs/components/segmented-control)
- [Select](https://snapshotui.com/docs/components/select)
- [Sheet](https://snapshotui.com/docs/components/sheet)
- [Side panel](https://snapshotui.com/docs/components/side-panel)
- [Sidebar](https://snapshotui.com/docs/components/sidebar)
- [Skeleton](https://snapshotui.com/docs/components/skeleton)
- [Spinner](https://snapshotui.com/docs/components/spinner)
- [Stat tile](https://snapshotui.com/docs/components/stat-tile)
- [Switch](https://snapshotui.com/docs/components/switch)
- [Tabs](https://snapshotui.com/docs/components/tabs)
- [Text area](https://snapshotui.com/docs/components/text-area)
- [Text field](https://snapshotui.com/docs/components/text-field)
- [Toast](https://snapshotui.com/docs/components/toast)
- [Tooltip](https://snapshotui.com/docs/components/tooltip)
- [Typography](https://snapshotui.com/docs/components/typography)
- [Upload tray](https://snapshotui.com/docs/components/upload-tray)

`styles.css` also draws the charts of `@snapshot-ui/charts`:

- [Line chart](https://snapshotui.com/docs/charts/line-chart)
- [Sparkline](https://snapshotui.com/docs/charts/sparkline)

## Links

- [Documentation](https://snapshotui.com/docs)
- [GitHub](https://github.com/amirehsan/snapshot-ui)
- [Design system](https://github.com/amirehsan/snapshot-ui/blob/main/docs/design-system.md)

## License

MIT
