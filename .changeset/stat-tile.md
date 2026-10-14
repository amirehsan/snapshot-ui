---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add StatTile: one headline figure on the Card's surface, with an overline `label`, a `numeral-sm` `value`, a `change` line (`direction` up, down or flat, the app's whole sentence as `label`, and a `tone` that is neutral by default, `gain` only for money that arrived and `warning` only for a state that needs a look, never red or green for up and down), a `caption`, a `trend` slot that moves under the caption on a narrow tile, `level` to put the label in the outline, and `href` to make the whole tile one link through `RouterProvider`. Every figure is your formatted string. A tile without `href` is a static component that a server component renders with no client JavaScript. A linked tile is named by everything it shows and must hold no link or button, and it forwards only the attributes React Aria's Link forwards, so not `title` or `role`, for example. The tile is a size container, so it takes its width from its column. `StatTileProps` and `StatTileChange` are exported. `stat-tile.css` in `styles.css`.
