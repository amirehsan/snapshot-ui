---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

DataTable takes `listBelow`: `'32rem'` keeps the table face down to 32rem of its own box, so a table beside an open SidePanel at 1440px stays a table while a phone still gets the list. Pass it when the columns that stay under 48rem fit in 32rem. The default, `'40rem'`, is 0.6's switch.
