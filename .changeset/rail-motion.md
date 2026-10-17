---
'@snapshot-ui/core': patch
---

Sidebar and AppShell: the rail opens and closes smoothly. The icons keep their place while the rail's edge moves, where they jumped to the middle of the wide rail and slid back; the labels fade and are cut by the moving edge, where they vanished at once on closing and wrapped a letter to a line for the first frames of opening; group names keep their row, so the links below them no longer jump up and down; and the rail, its parts, the chevron and the page beside it move on one curve, Material 3's emphasized easing, for 300ms opening and 250ms closing. Three motion tokens carry the values: `--ease-emphasized`, `--duration-expand` and `--duration-collapse`. Collapsed, a group's dot now sits in a row as tall as its name, so the collapsed list is 8px taller per group. Reduced motion still steps the rail in one frame.
