---
'@snapshot-ui/core': patch
'@snapshot-ui/react': patch
---

Sheet: the content is inert while the sheet is still sliding in, so neither the keyboard nor a pointer reaches it until it is open. A Select or other list opened during the slide, by a press or by a Tab from the trigger and a key, used to open outside the sheet, be hidden when the sheet finished entering, and leave focus on the page; now a Tab passes over the content and a press does nothing until the sheet is open, and a swipe still moves it. The CSS keeps the content free of pointer events while it enters, as a backup.
