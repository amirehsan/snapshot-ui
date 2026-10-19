---
'@snapshot-ui/core': patch
'@snapshot-ui/react': patch
---

StatTile and DataTable now declare `contain-intrinsic-inline-size: 0`, as DescriptionList, MonthGrid and a card header with actions do. The stand-in widths they named, a 16rem tile and a 12rem table, were also their narrowest widths, so two tiles or two tables side by side, each in its own wrapper in `1fr` tracks or `flex: 1` wrappers, pushed a 320px page sideways. A block, a `flex: 1` item, a `1fr` track or a flex row gives each its width, as before.

A StatTile placed straight in a flex row is unchanged: it now takes `flex: 0 1 16rem`, so it is still a whole 16rem tile there, and shrinks from it in a narrower row. In a flex column that basis is a height, so give a tile there `flex: none`. In an `auto` grid column, give a tile a width.

A DataTable whose holder sizes it from its content, such as an `auto` grid track, a flex column with `align-items: flex-start`, an `inline-block` or `width: max-content`, now draws 0 wide: give it a width there, such as `inline-size: 100%`.
