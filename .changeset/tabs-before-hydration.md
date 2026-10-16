---
'@snapshot-ui/react': patch
---

Tabs: the selected tab is in the tab order from the server's HTML on, so a row that scrolls can be reached by Tab before the page hydrates and axe no longer reports it as a scrollable region no key can reach. When the selected key names no tab, the first enabled tab takes the stop. A press on a tab, or on a DataTable row's link, that begins before hydration and ends after it now selects the tab or opens the link, where it used to do nothing: React Aria draws those elements again as the page hydrates, and the browser sent no click. A click that reaches a hydrated link tab without its pointerdown now follows the link instead of being cancelled.
