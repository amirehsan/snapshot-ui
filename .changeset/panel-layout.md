---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add PanelLayout, PanelNav, PanelNavItem, PanelSection and PanelRow for a settings page. Give each section its own address and pass `view` (`index` or `section`) and `sectionKey` from the URL; mark the open link `isCurrent` and, at the index, the section shown beside the list `isDefault`. From 48rem of its own width the layout draws the list beside the open section; under it, the list alone at the index and the section with a Back link at a section. Both are in the server's HTML, so a reload or the browser's Back lands right with no script. After a section change focus goes to the section's heading, and back at the index to the link you left. PanelSection and PanelRow are static; PanelRow pairs two cards, halves or a third and two thirds, from 66rem of its own width. A holder sized to its content gives the layout a width. `panel-layout.css` in `styles.css`.
