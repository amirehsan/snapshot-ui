---
'@snapshot-ui/core': patch
---

Sheet: the content takes no pointer while the sheet is still sliding in. A Select or other list pressed during the slide used to open outside the sheet, be hidden when the sheet finished entering, and leave focus on the page; now the press does nothing until the sheet is open, and a swipe still moves it.
