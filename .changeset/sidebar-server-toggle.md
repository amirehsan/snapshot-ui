---
'@snapshot-ui/core': patch
'@snapshot-ui/react': patch
---

Sidebar: before the page hydrates, the collapse button's name matches the rail as drawn. Beside an open SidePanel from 1024px to under 1440px the stylesheet folds the rail before any script runs, while the button still said "Collapse the menu"; the server's button now holds both names and the stylesheet shows the right one, and it states no expanded state until the page knows it.
