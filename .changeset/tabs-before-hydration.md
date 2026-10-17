---
'@snapshot-ui/react': patch
---

Tabs: the selected tab is in the tab order from the server's HTML on, so a row that scrolls can be reached by Tab before the page hydrates and axe no longer reports it as a scrollable region no key can reach. When the selected key names no tab, the first enabled tab takes the stop. A click that reaches a tab with no pointerdown before it, as a touch that begins before hydration and ends after it sends, now selects the tab or follows its link once, where React Aria cancelled it and the link opened nothing; a modified click on a link tab stays the browser's.
