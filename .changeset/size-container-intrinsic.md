---
'@snapshot-ui/core': patch
---

StatTile and DataTable now declare `contain-intrinsic-inline-size: 0`, as DescriptionList, MonthGrid and a card header with actions do. A size container takes no width from what it holds, and the stand-in widths they named, a 16rem tile and a 12rem table, were also their narrowest widths, so two tiles or two tables side by side in `1fr` tracks or `flex: 1` wrappers pushed a 320px page sideways. In a block, a `flex: 1` item, a `1fr` track or a flex row nothing changes. If you put a tile or a table where its holder takes the width of its content, such as a flex item with no `flex`, an `auto` grid column or `width: max-content`, give it a width now, for example `flex: 1 1 16rem` on a tile; otherwise it draws its padding wide.
