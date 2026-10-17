---
'@snapshot-ui/core': patch
---

Forced colors: text drawn in the reader's selection colors stays readable. Chromium drew a block in the system's background color behind the words of a chosen Menu row, the active CommandPalette row, an active FilterChip, a chosen Calendar day or preset, a focused DateRangePicker segment, the selected tab, the chosen SegmentedControl option, the current Pagination page, the current Sidebar item and the current BottomTabBar item, which could hide them. These parts now keep their own system colors, and the focus ring on a chosen Menu row, a chosen day or preset and around an active FilterChip shows against its fill.
