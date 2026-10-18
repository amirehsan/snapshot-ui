---
'@snapshot-ui/react': patch
---

Button now always writes an `id` on its `.button-label`, at rest as well as while pending, so React Aria's announcement of a focused button's pending start, which it keeps for seconds after the pending ends, still names an element that exists. The server's HTML of every Button gains the id, from `useId`; nothing drawn changes, but a markup snapshot of yours will.
