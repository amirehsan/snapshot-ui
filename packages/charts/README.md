# @snapshot-ui/charts

Charts for Snapshot UI, drawn on the server in SVG. Needs React 19 or later.

## Install

```bash
pnpm add @snapshot-ui/charts @snapshot-ui/core
```

The charts carry no CSS of their own. They need `@snapshot-ui/core` 0.3.0 or later for `charts.css`, which its `styles.css` imports, so an app still loads one stylesheet.

## Use

Import the stylesheet once, at the root of your app. A static chart, such as `Sparkline`, renders in a server component with no client JavaScript.

```tsx
import '@snapshot-ui/core/styles.css';
import { Sparkline } from '@snapshot-ui/charts';

export function Trend({ spending }: { spending: number[] }) {
  return <Sparkline data={spending} aria-label="Spending, last 30 days, rising" />;
}
```

Every figure a chart shows is a string from your app, and nothing is measured, so the server's HTML is final in any locale.

## Charts

Every name links to its page in the documentation, with examples, props and design rules.

- [Sparkline](https://snapshotui.com/docs/charts/sparkline)

## Links

- [Documentation](https://snapshotui.com/docs)
- [GitHub](https://github.com/amirehsan/snapshot-ui)
- [Design system](https://github.com/amirehsan/snapshot-ui/blob/main/docs/design-system.md)

## License

MIT
